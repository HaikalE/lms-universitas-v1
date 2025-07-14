  async toggleLike(id: string, currentUser: User) {
    console.log('❤️ Toggling like in service:', id);
    
    const post = await this.forumPostRepository.findOne({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post tidak ditemukan');
    }

    // Verify access to course
    await this.verifyUserCourseAccess(post.courseId, currentUser);

    // Simple like count increment (in real app, you'd track individual likes)
    post.likesCount = (post.likesCount || 0) + 1;
    await this.forumPostRepository.save(post);

    console.log('✅ Like toggled successfully');
    return {
      message: 'Like berhasil ditambahkan',
      likesCount: post.likesCount,
    };
  }